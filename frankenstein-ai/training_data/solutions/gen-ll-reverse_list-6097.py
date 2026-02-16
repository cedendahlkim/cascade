# Task: gen-ll-reverse_list-6097 | Score: 100% | 2026-02-13T15:28:25.421256

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))