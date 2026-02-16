# Task: gen-numtheory-digit_sum-1096 | Score: 100% | 2026-02-12T19:27:14.172534

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)