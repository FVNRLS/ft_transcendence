import { Controller, Get, Post, Delete, Put, Body, Param, Query } from '@nestjs/common';
import { CarService } from './car.service';
import { CarDto } from './car.dto';

interface PutCarByIdQuery {
  property_name: string;
  property_value: string;
}

@Controller('car')
export class CarController {
  constructor (private carService: CarService) {}

  @Get()
  public getCars() {
    return this.carService.getCars();
  }

  @Post()
  public postCar(@Body() car: CarDto) {
    this.carService.postCar(car);
  }

  @Get(':id')
  public getCarById(@Param('id') id: number) {
    return this.carService.getCarById(id);
  }

  @Delete(':id')
  public deleteCarById(@Param('id') id: number) {
    this.carService.deleteCarById(id);
  }

  @Put(':id')
  public putCarById(@Param('id') id: number, @Query() query: PutCarByIdQuery) {
    const propertyName = query.property_name;
    const propertyValue = query.property_value;
    return this.carService.putCarById(id, propertyName, propertyValue);
  }

}
