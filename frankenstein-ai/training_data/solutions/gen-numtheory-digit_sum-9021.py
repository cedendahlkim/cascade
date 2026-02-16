# Task: gen-numtheory-digit_sum-9021 | Score: 100% | 2026-02-12T16:38:36.416637

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)