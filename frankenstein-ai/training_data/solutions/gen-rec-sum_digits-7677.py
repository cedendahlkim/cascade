# Task: gen-rec-sum_digits-7677 | Score: 100% | 2026-02-13T18:33:46.030976

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)