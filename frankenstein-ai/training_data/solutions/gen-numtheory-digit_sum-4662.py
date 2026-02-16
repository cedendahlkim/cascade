# Task: gen-numtheory-digit_sum-4662 | Score: 100% | 2026-02-12T12:37:14.176573

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)