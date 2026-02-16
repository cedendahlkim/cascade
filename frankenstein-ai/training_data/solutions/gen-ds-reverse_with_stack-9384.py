# Task: gen-ds-reverse_with_stack-9384 | Score: 100% | 2026-02-13T11:54:46.262539

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))