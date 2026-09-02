-- CreateTable
CREATE TABLE "public"."Province" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."District" (
    "id" SERIAL NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Province_slug_key" ON "public"."Province"("slug");

-- CreateIndex
CREATE INDEX "District_provinceId_idx" ON "public"."District"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "District_provinceId_slug_key" ON "public"."District"("provinceId", "slug");

-- AddForeignKey
ALTER TABLE "public"."District" ADD CONSTRAINT "District_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;
