# Task: gen-ll-reverse_list-6765 | Score: 100% | 2026-02-15T09:51:05.937356

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))