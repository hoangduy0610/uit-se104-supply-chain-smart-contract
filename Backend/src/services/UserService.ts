import { HttpStatus, Injectable } from '@nestjs/common';
import { MessageCode } from 'src/commons/MessageCode';
import { ApplicationException } from 'src/controllers/ExceptionController';
import { CreateUserDto } from 'src/dtos/CreateUserDto';
import { UserInterfaces } from 'src/interfaces/UserInterfaces';
import { UserModal } from 'src/modals/UserModals';
import { UserRepository } from '../repositories/UserRepository';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository
    ) { }

    async listUser(user: UserInterfaces): Promise<UserModal[]> {
        return UserModal.fromUsers(await this.userRepository.listUser());
    }

    async findUserById(id: string): Promise<UserModal> {
        try {
            return new UserModal(await this.userRepository.findUserById(id));
        } catch (e) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, MessageCode.USER_NOT_FOUND)
        }
    }

    async findOneByUsername(username: string): Promise<UserModal> {
        const user = await this.userRepository.findOneByUsername(username);
        if (!user) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, MessageCode.USER_NOT_REGISTER);
        }
        return new UserModal(user);
    }

    async createUser(user: UserInterfaces, dto: CreateUserDto): Promise<UserModal> {
        if (Object.values(dto).some(o => !o)) throw new ApplicationException(HttpStatus.BAD_REQUEST, MessageCode.USER_CREATE_ERROR);
        const auth = await this.userRepository.findAuthInfo(dto.username);
        // chỗ này phải thêm check xem có phải trường mình đang làm amdinko 
        if (!auth) {
            throw new ApplicationException(HttpStatus.UNAUTHORIZED, MessageCode.USER_NOT_FOUND);
        }

        if (auth.userId && auth.userId != '') throw new ApplicationException(HttpStatus.BAD_REQUEST, MessageCode.USER_ALREADY_EXISTED)

        const create = await this.userRepository.createUser(dto);
        if (!create) throw new ApplicationException(HttpStatus.BAD_REQUEST, MessageCode.USER_CREATE_ERROR)

        const authInfo = await this.userRepository.setAuth(dto.username, create.id);
        if (!authInfo) throw new ApplicationException(HttpStatus.BAD_REQUEST, MessageCode.USER_CREATE_ERROR)

        return new UserModal(await this.userRepository.findOneByUsername(dto.username));
    }

    async setDefault(user: UserInterfaces, id: string): Promise<UserModal> {
        return new UserModal(await this.userRepository.setDefault(user.id, id));
    }
}
