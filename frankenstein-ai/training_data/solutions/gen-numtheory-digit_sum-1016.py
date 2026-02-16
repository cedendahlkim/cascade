# Task: gen-numtheory-digit_sum-1016 | Score: 100% | 2026-02-13T14:31:07.001379

n = int(input())
print(sum(int(d) for d in str(abs(n))))