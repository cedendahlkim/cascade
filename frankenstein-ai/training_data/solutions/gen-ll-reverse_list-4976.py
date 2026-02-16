# Task: gen-ll-reverse_list-4976 | Score: 100% | 2026-02-13T20:16:40.964583

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))