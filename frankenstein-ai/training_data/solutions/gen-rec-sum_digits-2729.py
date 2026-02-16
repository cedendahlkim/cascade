# Task: gen-rec-sum_digits-2729 | Score: 100% | 2026-02-13T14:42:12.575032

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)