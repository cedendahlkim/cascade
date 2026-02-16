# Task: gen-rec-sum_digits-2224 | Score: 100% | 2026-02-13T16:06:57.521817

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)