# Task: gen-numtheory-digit_sum-1960 | Score: 100% | 2026-02-14T12:02:51.576725

n = int(input())
print(sum(int(d) for d in str(abs(n))))