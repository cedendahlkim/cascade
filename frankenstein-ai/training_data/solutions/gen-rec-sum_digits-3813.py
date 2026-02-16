# Task: gen-rec-sum_digits-3813 | Score: 100% | 2026-02-13T12:12:54.609704

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)