all:
	rm -r build | true
	mkdir -p build/backend build/frontend
	babel -d build/backend/ backend/
