# Task: gen-numtheory-digit_sum-1562 | Score: 100% | 2026-02-13T18:21:06.441809

n = int(input())
print(sum(int(d) for d in str(abs(n))))