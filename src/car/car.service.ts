import { Injectable, HttpException } from '@nestjs/common';
import { CARS } from './cars.mock';
import { CarDto } from './car.dto';

interface Car {
  id: number;
  brand: string;
  color: string;
  model: string;
  [key: string]: any;
}

@Injectable()
export class CarService {
  private cars = CARS;

  public getCars() {
    return this.cars;
  }


  public postCar(car: CarDto) {
    return this.cars.push();
  }

  public getCarById(id: number) {
    const car = this.cars.find((car) => car.id === id);
    if (!car) {
      throw new HttpException('Not Found', 404);
    }
    return car;
  }


  public deleteCarById(id: number) {
    const index = this.cars.findIndex((car) => car.id === id);
    if (index === -1) {
      throw new HttpException('Not Found', 404);
    }
    this.cars.splice(index, 1);
    return this.cars;
  }


  public putCarById(id: number, propertyName: string, propertyValue: string) {
    const index = this.cars.findIndex((car) => car.id === id);
    if (index === -1) {
      throw new HttpException('Not Found', 404);
    }
    const car = this.cars[index];
    if (!(propertyName in car)) {
      throw new HttpException(`Property '${propertyName}' not found on Car object`, 400);
    }
    (car as any)[propertyName] = propertyValue;
    return this.cars;
  }

}
