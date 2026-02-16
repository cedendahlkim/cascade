# Task: gen-ll-reverse_list-3299 | Score: 100% | 2026-02-13T19:24:52.036490

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))