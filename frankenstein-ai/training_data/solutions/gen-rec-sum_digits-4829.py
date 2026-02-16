# Task: gen-rec-sum_digits-4829 | Score: 100% | 2026-02-10T15:42:44.105701

def recursive_digit_sum(n):
    n_str = str(n)
    if len(n_str) == 1:
        return int(n_str)
    else:
        sum_digits = sum(int(digit) for digit in n_str)
        return recursive_digit_sum(sum_digits)

n = int(input())
print(recursive_digit_sum(n))