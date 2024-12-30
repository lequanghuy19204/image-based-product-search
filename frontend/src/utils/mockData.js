// export const TEST_ACCOUNTS = {
//     admin: {
//       email: 'admin@test.com',
//       password: 'admin123',
//       role: 'admin'
//     },
//     user: {
//       email: 'user@test.com',
//       password: 'user123',
//       role: 'user'
//     }
//   };
  
//   // Hàm đăng nhập local
//   export const mockLoginWithEmail = (email, password) => {
//     return new Promise((resolve, reject) => {
//       // Kiểm tra tài khoản trong TEST_ACCOUNTS
//       const user = Object.values(TEST_ACCOUNTS).find(
//         account => account.email === email && account.password === password
//       );
  
//       if (user) {
//         resolve(user);
//       } else {
//         reject(new Error('Email hoặc mật khẩu không chính xác'));
//       }
//     });
//   };