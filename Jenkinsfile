pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USERNAME = 'dinhtrieuxtnd'
        DOCKER_IMAGE = "${DOCKER_HUB_USERNAME}/do-an-server"
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDENTIALS = 'dockerhub-credentials'
        NODE_VERSION = '22'
        // Dummy DATABASE_URL cho prisma generate và build (không cần connect thực sự)
        DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }
        
        stage('Generate Prisma Client') {
            steps {
                echo 'Generating Prisma Client for production...'
                script {
                    if (isUnix()) {
                        sh 'npx prisma generate'
                    } else {
                        bat 'npx prisma generate'
                    }
                }
            }
        }
        
        stage('Generate Test Prisma Client') {
            steps {
                echo 'Generating Prisma Test Client for SQLite...'
                script {
                    if (isUnix()) {
                        sh 'npx prisma generate --schema=prisma/schema.test.prisma'
                    } else {
                        bat 'npx prisma generate --schema=prisma/schema.test.prisma'
                    }
                }
            }
        }
        
        stage('Generate Test Schema SQL') {
            steps {
                echo 'Generating test-schema.sql for SQLite...'
                script {
                    if (isUnix()) {
                        sh 'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.test.prisma --script > prisma/test-schema.sql'
                    } else {
                        bat 'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.test.prisma --script > prisma/test-schema.sql'
                    }
                }
            }
        }
        
        stage('Run Unit Tests') {
            steps {
                echo 'Running unit tests with coverage...'
                script {
                    try {
                        if (isUnix()) {
                            sh 'npm run test:cov'
                        } else {
                            bat 'npm run test:cov'
                        }
                    } catch (Exception e) {
                        echo "Unit tests failed: ${e.message}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('Run E2E Tests') {
            steps {
                echo 'Running E2E tests...'
                script {
                    try {
                        if (isUnix()) {
                            sh 'npm run test:e2e'
                        } else {
                            bat 'npm run test:e2e'
                        }
                    } catch (Exception e) {
                        echo "E2E tests failed: ${e.message}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('Build Application') {
            steps {
                echo 'Building application...'
                script {
                    if (isUnix()) {
                        sh 'npm run build'
                    } else {
                        bat 'npm run build'
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    dockerImage = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.build("${DOCKER_IMAGE}:latest")
                }
            }
        }
        
        stage('Login to Docker Hub') {
            steps {
                echo 'Logging in to Docker Hub...'
                script {
                    docker.withRegistry('https://registry.hub.docker.com', "${DOCKER_HUB_CREDENTIALS}") {
                        echo 'Successfully logged in to Docker Hub'
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing Docker image to Docker Hub...'
                script {
                    docker.withRegistry('https://registry.hub.docker.com', "${DOCKER_HUB_CREDENTIALS}") {
                        dockerImage.push("${DOCKER_TAG}")
                        dockerImage.push("latest")
                        echo "Successfully pushed ${DOCKER_IMAGE}:${DOCKER_TAG} and ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }
        
        stage('Deploy to Development') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to development environment...'
                script {
                    if (isUnix()) {
                        sh '''
                            docker-compose -f docker-compose.dev.yml down || true
                            docker-compose -f docker-compose.dev.yml up -d
                        '''
                    } else {
                        bat '''
                            docker-compose -f docker-compose.dev.yml down
                            docker-compose -f docker-compose.dev.yml up -d
                        '''
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to production environment...'
                script {
                    if (isUnix()) {
                        sh '''
                            docker-compose -f docker-compose.prod.yml down || true
                            docker-compose -f docker-compose.prod.yml up -d
                        '''
                    } else {
                        bat '''
                            docker-compose -f docker-compose.prod.yml down
                            docker-compose -f docker-compose.prod.yml up -d
                        '''
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline executed successfully!'
            echo "Docker Image: ${DOCKER_IMAGE}:${DOCKER_TAG}"
            echo "Docker Hub: https://hub.docker.com/r/${DOCKER_HUB_USERNAME}/do-an-server"
            
            // Publish test results if available
            script {
                if (fileExists('coverage/lcov.info')) {
                    echo 'Test coverage report generated successfully'
                }
            }
        }
        failure {
            echo 'Pipeline failed!'
            echo 'Check the console output for details'
        }
        unstable {
            echo 'Pipeline completed with test failures'
            echo 'Some tests failed, but build continued'
        }
        always {
            echo 'Cleaning up workspace...'
            
            // Archive test results and coverage reports
            script {
                try {
                    if (fileExists('coverage')) {
                        archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                        echo 'Coverage reports archived'
                    }
                } catch (Exception e) {
                    echo "Could not archive artifacts: ${e.message}"
                }
            }
            
            cleanWs()
        }
    }
}
