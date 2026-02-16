# Task: gen-ds-reverse_with_stack-5321 | Score: 100% | 2026-02-13T11:18:10.784531

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))