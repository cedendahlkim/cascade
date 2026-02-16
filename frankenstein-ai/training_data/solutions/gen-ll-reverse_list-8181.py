# Task: gen-ll-reverse_list-8181 | Score: 100% | 2026-02-15T08:24:05.507506

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))