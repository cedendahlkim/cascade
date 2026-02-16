# Task: gen-rec-sum_digits-9597 | Score: 100% | 2026-02-12T20:55:10.323948

def recursive_digit_sum(n):
    n_str = str(n)
    if len(n_str) == 1:
        return int(n_str)
    else:
        digit_sum = sum(int(digit) for digit in n_str)
        return recursive_digit_sum(digit_sum)

n = int(input())
print(recursive_digit_sum(n))