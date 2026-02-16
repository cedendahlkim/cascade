# Task: gen-rec-sum_digits-6936 | Score: 100% | 2026-02-13T09:34:34.469991

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)