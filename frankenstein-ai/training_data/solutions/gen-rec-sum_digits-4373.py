# Task: gen-rec-sum_digits-4373 | Score: 100% | 2026-02-13T09:20:42.728742

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)