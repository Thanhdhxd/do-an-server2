/**
 * File: test/helpers/test-database.helper.ts
 * 
 * Chức năng: 
 * - Setup SQLite in-memory database
 * - Run Prisma migrations
 * - Clear all tables
 * - Seed common data (roles, sample users)
 */

import { PrismaClient as TestPrismaClient } from "@prisma/test-client";
import { Role } from "@prisma/test-client";
import * as bcrypt from "bcrypt";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtempSync, rmSync, readFileSync } from "fs";

export class TestDatabaseHelper {
    private static tempDir: string;
    private static testDatabaseUrl: string;

    static async setup(): Promise<TestPrismaClient> {
        // Create temp directory for test database
        this.tempDir = mkdtempSync(join(tmpdir(), 'prisma-test-'));
        this.testDatabaseUrl = `file:${join(this.tempDir, 'test.db')}`;
        
        // Set environment variable for test database
        process.env.TEST_DATABASE_URL = this.testDatabaseUrl;

        console.log('Setting up SQLite database at:', this.testDatabaseUrl);

        // Create PrismaClient
        const prisma = new TestPrismaClient({
            datasources: {
                db: {
                    url: this.testDatabaseUrl,
                },
            },
        });

        await prisma.$connect();
        
        // Read and execute SQL schema from generated file
        try {
            const schemaSQL = readFileSync(
                join(process.cwd(), 'prisma', 'test-schema.sql'),
                'utf-8'
            );
            
            // Split SQL statements and execute them
            const statements = schemaSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => 
                    s.length > 0 && 
                    !s.startsWith('node.exe') && 
                    !s.startsWith('[dotenv') &&
                    !s.startsWith('At ') &&
                    !s.startsWith('+') &&
                    !s.startsWith('CategoryInfo') &&
                    !s.startsWith('FullyQualifiedErrorId')
                );
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await prisma.$executeRawUnsafe(statement);
                }
            }
            
            console.log('Database schema created successfully');
        } catch (error) {
            console.error("Failed to create database schema:", error);
            throw error;
        }
        
        return prisma;
    }

    static async clearDatabase(prisma: TestPrismaClient): Promise<void> {
        // Delete data from all tables in reverse dependency order
        const tables = [
            "QuizAnswer",
            "QuizAttempt",
            "QuizOptionMedia",
            "QuizQuestionMedia",
            "QuizQuestionGroupMedia",
            "QuizOption",
            "QuizQuestion",
            "QuizQuestionGroup",
            "QuizSection",
            "Quiz",
            "ExerciseSubmission",
            "Exercise",
            "Lecture",
            "Lesson",
            "JoinRequest",
            "ClassroomStudent",
            "Classroom",
            "ActivityLog",
            "RefreshToken",
            "User",
            "Media",
            "OtpRecord",
        ];

        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
            } catch (error) {
                // Ignore errors for tables that might not exist
                console.warn(`Warning: Could not clear table ${table}`);
            }
        }
    }

    static async seedData(prisma: TestPrismaClient): Promise<any> {
        const passwordHash = await bcrypt.hash("password123", 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: "admin@test.com",
                fullName: "Admin User",
                passwordHash,
                phoneNumber: "+84901000001",
                role: Role.admin,
                isActive: true,
            },
        });

        // Create student users
        const student1 = await prisma.user.create({
            data: {
                email: "student1@test.com",
                fullName: "Student One",
                passwordHash,
                phoneNumber: "+84901000002",
                role: Role.student,
                isActive: true,
            },
        });

        const student2 = await prisma.user.create({
            data: {
                email: "student2@test.com",
                fullName: "Student Two",
                passwordHash,
                phoneNumber: "+84901000003",
                role: Role.student,
                isActive: true,
            },
        });

        const student3 = await prisma.user.create({
            data: {
                email: "student3@test.com",
                fullName: "Student Three",
                passwordHash,
                phoneNumber: "+84901000004",
                role: Role.student,
                isActive: true,
            },
        });

        // Create classrooms
        const classroom1 = await prisma.classroom.create({
            data: {
                name: "Test Classroom 1",
                description: "This is a test classroom",
                isArchived: false,
            },
        });

        const classroom2 = await prisma.classroom.create({
            data: {
                name: "Test Classroom 2",
                description: "Another test classroom",
                isArchived: false,
            },
        });

        // Add students to classroom
        await prisma.classroomStudent.create({
            data: {
                classroomId: classroom1.id,
                studentId: student1.id,
                isActive: true,
            },
        });

        return {
            users: {
                admin,
                student1,
                student2,
                student3,
            },
            classrooms: {
                classroom1,
                classroom2,
            },
        };
    }

    static async teardown(prisma: TestPrismaClient): Promise<void> {
        try {
            await prisma.$disconnect();
        } catch (error) {
            console.warn('Warning: Could not disconnect Prisma client', error);
        }
        
        // Clean up temp directory
        if (this.tempDir) {
            try {
                rmSync(this.tempDir, { recursive: true, force: true });
            } catch (error) {
                console.warn('Warning: Could not clean up temp directory', error);
            }
        }
        
        // Force cleanup
        this.tempDir = null as any;
        this.testDatabaseUrl = null as any;
    }
    
    static async cleanup(): Promise<void> {
        // Alias for teardown
        if (this.tempDir) {
            try {
                rmSync(this.tempDir, { recursive: true, force: true });
            } catch (error) {
                console.warn('Warning: Could not clean up temp directory', error);
            }
        }
    }
}