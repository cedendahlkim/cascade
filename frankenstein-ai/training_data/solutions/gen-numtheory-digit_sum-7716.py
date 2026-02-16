# Task: gen-numtheory-digit_sum-7716 | Score: 100% | 2026-02-12T12:14:05.484222

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)