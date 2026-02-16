# Task: 2.3 | Score: 100% | 2026-02-13T18:29:53.993135

n = int(input())

if n % 3 == 0 and n % 5 == 0:
  print('FizzBuzz')
elif n % 3 == 0:
  print('Fizz')
elif n % 5 == 0:
  print('Buzz')
else:
  print(n)