# Task: gen-numtheory-reverse_number-6743 | Score: 100% | 2026-02-12T14:31:47.375665

n = int(input())
reversed_n = 0
while n > 0:
    digit = n % 10
    reversed_n = reversed_n * 10 + digit
    n //= 10
print(reversed_n)