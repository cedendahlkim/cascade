# Task: gen-numtheory-digit_sum-1021 | Score: 100% | 2026-02-13T18:29:58.556164

n = int(input())
print(sum(int(d) for d in str(abs(n))))