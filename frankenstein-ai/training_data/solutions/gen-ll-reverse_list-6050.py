# Task: gen-ll-reverse_list-6050 | Score: 100% | 2026-02-13T19:35:38.183541

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))