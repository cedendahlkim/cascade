# Task: gen-ll-reverse_list-4477 | Score: 100% | 2026-02-14T13:26:19.831979

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))