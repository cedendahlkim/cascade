# Task: gen-numtheory-digit_sum-3943 | Score: 100% | 2026-02-13T17:36:13.159903

n = int(input())
print(sum(int(d) for d in str(abs(n))))