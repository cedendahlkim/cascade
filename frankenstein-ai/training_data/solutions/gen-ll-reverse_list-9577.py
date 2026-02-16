# Task: gen-ll-reverse_list-9577 | Score: 100% | 2026-02-14T12:04:25.013954

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))