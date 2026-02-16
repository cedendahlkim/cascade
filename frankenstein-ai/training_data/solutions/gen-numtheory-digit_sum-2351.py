# Task: gen-numtheory-digit_sum-2351 | Score: 100% | 2026-02-12T13:22:44.325537

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)