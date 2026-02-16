# Task: gen-ll-reverse_list-8088 | Score: 100% | 2026-02-13T12:27:12.414232

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))