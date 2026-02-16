# Task: gen-ll-reverse_list-1367 | Score: 100% | 2026-02-14T13:41:03.984380

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))