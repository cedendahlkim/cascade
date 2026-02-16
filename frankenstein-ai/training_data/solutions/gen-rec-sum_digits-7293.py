# Task: gen-rec-sum_digits-7293 | Score: 100% | 2026-02-13T20:17:16.863934

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)