# Task: gen-ll-reverse_list-4483 | Score: 100% | 2026-02-13T13:53:10.887633

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))