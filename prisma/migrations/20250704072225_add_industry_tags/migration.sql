-- CreateTable
CREATE TABLE "industry_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industry_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_industries" (
    "company_id" UUID NOT NULL,
    "industry_tag_id" UUID NOT NULL,

    CONSTRAINT "company_industries_pkey" PRIMARY KEY ("company_id","industry_tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industry_tags_name_key" ON "industry_tags"("name");

-- AddForeignKey
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_industries" ADD CONSTRAINT "company_industries_industry_tag_id_fkey" FOREIGN KEY ("industry_tag_id") REFERENCES "industry_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
