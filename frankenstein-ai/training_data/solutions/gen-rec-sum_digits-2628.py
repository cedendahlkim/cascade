# Task: gen-rec-sum_digits-2628 | Score: 100% | 2026-02-13T19:05:37.310087

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)