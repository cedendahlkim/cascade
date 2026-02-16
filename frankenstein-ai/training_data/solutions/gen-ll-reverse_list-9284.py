# Task: gen-ll-reverse_list-9284 | Score: 100% | 2026-02-14T13:41:07.458377

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))