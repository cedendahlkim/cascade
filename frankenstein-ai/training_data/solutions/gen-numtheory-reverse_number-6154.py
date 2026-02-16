# Task: gen-numtheory-reverse_number-6154 | Score: 100% | 2026-02-13T09:03:47.651031

n = int(input())
reversed_n = 0
while n > 0:
    reversed_n = reversed_n * 10 + n % 10
    n //= 10
print(reversed_n)