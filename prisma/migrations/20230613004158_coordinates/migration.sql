-- CreateTable
CREATE TABLE "Coordinates" (
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "addressId" TEXT NOT NULL,
    "zenstack_guard" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Coordinates_pkey" PRIMARY KEY ("lat","lng")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coordinates_addressId_key" ON "Coordinates"("addressId");

-- AddForeignKey
ALTER TABLE "Coordinates" ADD CONSTRAINT "Coordinates_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
