# Task: gen-rec-sum_digits-8934 | Score: 100% | 2026-02-13T17:36:16.784531

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)