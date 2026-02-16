# Task: gen-ds-reverse_with_stack-5949 | Score: 100% | 2026-02-15T11:12:54.788136

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))