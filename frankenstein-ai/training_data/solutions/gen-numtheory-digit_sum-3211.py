# Task: gen-numtheory-digit_sum-3211 | Score: 100% | 2026-02-12T12:07:59.380568

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)