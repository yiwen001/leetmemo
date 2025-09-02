-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "github_id" TEXT,
    "gitee_id" TEXT,
    "provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."problems" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "order_index" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "leetcode_id" TEXT,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "study_plan_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "time_spent" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT DEFAULT '',
    "last_review_date" TIMESTAMP(3),
    "first_study_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL,
    "intensity" TEXT NOT NULL DEFAULT 'medium',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "plan_problems" TEXT[],
    "learned_problems" TEXT[],
    "pending_tasks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_tasks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "original_date" TIMESTAMP(3) NOT NULL,
    "current_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_items" (
    "id" TEXT NOT NULL,
    "daily_task_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "task_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leetcode_problems" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleCn" TEXT,
    "difficulty" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tags" TEXT[],
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leetcode_problems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "public"."users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_gitee_id_key" ON "public"."users"("gitee_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_records_user_id_problem_id_key" ON "public"."study_records"("user_id", "problem_id");

-- CreateIndex
CREATE INDEX "task_items_daily_task_id_idx" ON "public"."task_items"("daily_task_id");

-- CreateIndex
CREATE UNIQUE INDEX "leetcode_problems_number_key" ON "public"."leetcode_problems"("number");

-- AddForeignKey
ALTER TABLE "public"."problems" ADD CONSTRAINT "problems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."problems" ADD CONSTRAINT "problems_leetcode_id_fkey" FOREIGN KEY ("leetcode_id") REFERENCES "public"."leetcode_problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_records" ADD CONSTRAINT "study_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_records" ADD CONSTRAINT "study_records_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."leetcode_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_records" ADD CONSTRAINT "study_records_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "public"."study_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_tasks" ADD CONSTRAINT "daily_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_items" ADD CONSTRAINT "task_items_daily_task_id_fkey" FOREIGN KEY ("daily_task_id") REFERENCES "public"."daily_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_items" ADD CONSTRAINT "task_items_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."leetcode_problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
