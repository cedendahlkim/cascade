# Task: gen-rec-sum_digits-2669 | Score: 100% | 2026-02-15T13:30:43.711172

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)