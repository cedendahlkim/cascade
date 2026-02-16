# Task: gen-numtheory-digit_sum-2212 | Score: 100% | 2026-02-12T14:17:55.995646

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)