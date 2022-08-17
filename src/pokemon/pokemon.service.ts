import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { json } from 'stream/consumers';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import {v4 as uuid} from 'uuid';
import { runInThisContext } from 'vm';
@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel = Model<Pokemon>
  ){}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto)
      return pokemon;
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  findAll() {
    return `This action returns all pokemon`;
  }

  async findOne(term: string ) {

    let pokemonFound: Pokemon;
    // By no
    if(!isNaN(+term)){
      pokemonFound = await this.pokemonModel.findOne({no: term})
    }
    // By _id
    if(!pokemonFound && isValidObjectId(term)){
      pokemonFound = await this.pokemonModel.findById(term)
    }
    // By name
    if(!pokemonFound){
      pokemonFound = await this.pokemonModel.findOne({name: term.toLowerCase().trim()})
    }


    if(!pokemonFound){
      throw new BadRequestException(`Pokemon with id ${term} does not exist`);
    }

    return pokemonFound;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemonFound = await this.findOne(term)

    if(updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    try {
      const pokemonUpdated = await pokemonFound.updateOne(updatePokemonDto)
      return {...pokemonFound.toJSON(), ...updatePokemonDto}
    } catch (error) {
      this.handleExceptions(error)
    }

  }

  async remove(id: string) {
    // const pokemonFound = await this.findOne(term)
    // try {
    //   const pokemonDeleted = await pokemonFound.delete()
    //   return pokemonDeleted
    // } catch (error) {
    //   this.handleExceptions(error)
    // }

    const { deletedCount } = await this.pokemonModel.deleteOne({_id: id})
    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with "${id}" was not found `)
    }
    return `Pokemon with "${id}" id was deleted `
  }


  private handleExceptions(error){
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon already exists in DB ${ JSON.stringify(error.keyValue)}`)
    }

    console.log(error);
    throw new InternalServerErrorException("Can't Create pokemon -- Check server logs")
  }
}
